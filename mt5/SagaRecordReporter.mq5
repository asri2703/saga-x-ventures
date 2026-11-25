//+------------------------------------------------------------------+
//| SagaRecordReporter.mq5                                           |
//|                                                                  |
//| Posts this account's balance, equity and closed deals to the     |
//| website every hour, for the record chart on /copytrade.          |
//|                                                                  |
//| It NEVER trades. It reads the account and sends what it read.    |
//| Attach it to any one chart in the terminal logged in to the      |
//| master account, alongside the trading EA — it does not touch it. |
//|                                                                  |
//| Setup: see mt5/README.md.                                        |
//+------------------------------------------------------------------+
#property copyright "Saga X Ventures"
#property version   "1.00"
#property description "Reports balance, equity and closed deals to the website. Never trades."

input string InpEndpoint        = "https://sagaxventures.com/api/record/ingest"; // Ingest URL
input string InpSecret          = "";  // RECORD_INGEST_SECRET (same value as on Vercel)
input int    InpIntervalMinutes = 60;  // Minutes between reports

#define MAX_DEALS_PER_POST 500   // must not exceed MAX_DEALS in src/lib/record-feed.ts
#define SAMPLE_SECONDS     10    // how often equity is sampled for the low
#define RETRY_SECONDS      300   // after a failed post, try again this soon

double   g_equityLow  = 0;
datetime g_lastSent   = 0;  // GMT
string   g_syncVar    = "";

//+------------------------------------------------------------------+
int OnInit()
  {
   if(StringLen(InpSecret) < 32)
     {
      Print("SagaRecord: InpSecret must be the 32+ character RECORD_INGEST_SECRET.");
      return(INIT_PARAMETERS_INCORRECT);
     }
   if(InpIntervalMinutes < 5)
     {
      Print("SagaRecord: InpIntervalMinutes must be 5 or more.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   // Per login, so a second terminal on the same VPS keeps its own place.
   g_syncVar   = "SagaRecord." + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ".LastDeal";
   g_equityLow = AccountInfoDouble(ACCOUNT_EQUITY);
   g_lastSent  = 0;  // report on the first timer tick

   EventSetTimer(SAMPLE_SECONDS);
   PrintFormat("SagaRecord: started for account %I64d, reporting every %d min to %s",
               AccountInfoInteger(ACCOUNT_LOGIN), InpIntervalMinutes, InpEndpoint);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   // Nothing on ticks. Everything runs on the timer, so a quiet market
   // still gets its hourly reading.
  }

//+------------------------------------------------------------------+
void OnTimer()
  {
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))
      return;

   // Track the lowest equity between reports, so a dip that recovered
   // inside the hour still shows in the drawdown.
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(g_equityLow <= 0 || equity < g_equityLow)
      g_equityLow = equity;

   datetime now = TimeGMT();
   if(g_lastSent != 0 && now - g_lastSent < InpIntervalMinutes * 60)
      return;

   if(Report())
     {
      g_lastSent  = now;
      g_equityLow = equity;
     }
   else
     {
      // Retry in RETRY_SECONDS rather than waiting a whole interval.
      g_lastSent = now - InpIntervalMinutes * 60 + RETRY_SECONDS;
     }
  }

//+------------------------------------------------------------------+
//| Broker server time minus GMT, rounded to the quarter hour.       |
//+------------------------------------------------------------------+
long ServerOffsetSeconds()
  {
   long diff = (long)(TimeTradeServer() - TimeGMT());
   return((long)MathRound(diff / 900.0) * 900);
  }

//+------------------------------------------------------------------+
string Num(const double value, const int digits)
  {
   return(DoubleToString(value, digits));
  }

//+------------------------------------------------------------------+
string JsonText(string text)
  {
   StringReplace(text, "\\", "\\\\");
   StringReplace(text, "\"", "\\\"");
   return("\"" + text + "\"");
  }

//+------------------------------------------------------------------+
string DealJson(const ulong ticket, const long offset)
  {
   long serverTime = HistoryDealGetInteger(ticket, DEAL_TIME);
   return("{\"ticket\":"       + IntegerToString((long)ticket) +
          ",\"position_id\":"  + IntegerToString(HistoryDealGetInteger(ticket, DEAL_POSITION_ID)) +
          ",\"time\":"         + IntegerToString(serverTime - offset) +
          ",\"type\":"         + IntegerToString(HistoryDealGetInteger(ticket, DEAL_TYPE)) +
          ",\"entry\":"        + IntegerToString(HistoryDealGetInteger(ticket, DEAL_ENTRY)) +
          ",\"symbol\":"       + JsonText(HistoryDealGetString(ticket, DEAL_SYMBOL)) +
          ",\"volume\":"       + Num(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) +
          ",\"price\":"        + Num(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) +
          ",\"profit\":"       + Num(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) +
          ",\"swap\":"         + Num(HistoryDealGetDouble(ticket, DEAL_SWAP), 2) +
          ",\"commission\":"   + Num(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2) +
          ",\"fee\":"          + Num(HistoryDealGetDouble(ticket, DEAL_FEE), 2) +
          "}");
  }

//+------------------------------------------------------------------+
//| One snapshot, plus every deal since the last confirmed sync,     |
//| in chunks. The sync point only moves once every chunk is         |
//| accepted, and it overlaps by a day on purpose: the server        |
//| upserts on the ticket, so a repeat costs nothing and a gap       |
//| would cost a trade.                                              |
//+------------------------------------------------------------------+
bool Report()
  {
   long     login    = AccountInfoInteger(ACCOUNT_LOGIN);
   long     offset   = ServerOffsetSeconds();
   datetime lastSync = GlobalVariableCheck(g_syncVar) ? (datetime)GlobalVariableGet(g_syncVar) : 0;
   datetime from     = lastSync > 86400 ? lastSync - 86400 : 0;   // server time
   datetime to       = TimeTradeServer() + 86400;

   if(!HistorySelect(from, to))
     {
      Print("SagaRecord: HistorySelect failed, error ", GetLastError());
      return(false);
     }

   int total = HistoryDealsTotal();
   ulong tickets[];
   ArrayResize(tickets, total);
   for(int i = 0; i < total; i++)
      tickets[i] = HistoryDealGetTicket(i);

   string snapshot =
      "\"login\":"       + IntegerToString(login) +
      ",\"taken_at\":"   + IntegerToString((long)TimeGMT()) +
      ",\"balance\":"    + Num(AccountInfoDouble(ACCOUNT_BALANCE), 2) +
      ",\"equity\":"     + Num(AccountInfoDouble(ACCOUNT_EQUITY), 2) +
      ",\"equity_low\":" + Num(g_equityLow, 2);

   datetime newest = lastSync;
   int start = 0;
   do
     {
      int end = MathMin(start + MAX_DEALS_PER_POST, total);
      string deals = "";
      for(int i = start; i < end; i++)
        {
         ulong ticket = tickets[i];
         if(ticket == 0)
            continue;
         datetime t = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         if(t > newest)
            newest = t;
         deals += (deals == "" ? "" : ",") + DealJson(ticket, offset);
        }

      if(!Post("{" + snapshot + ",\"deals\":[" + deals + "]}"))
         return(false);
      start = end;
     }
   while(start < total);

   GlobalVariableSet(g_syncVar, (double)newest);
   PrintFormat("SagaRecord: reported, %d deal(s) since %s", total, TimeToString(from));
   return(true);
  }

//+------------------------------------------------------------------+
bool Post(const string body)
  {
   char data[];
   char result[];
   string responseHeaders;

   int n = StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(data, n - 1);   // drop the terminating zero

   string headers = "Content-Type: application/json\r\n" +
                    "Authorization: Bearer " + InpSecret + "\r\n";

   ResetLastError();
   int status = WebRequest("POST", InpEndpoint, headers, 15000, data, result, responseHeaders);

   if(status == -1)
     {
      int err = GetLastError();
      if(err == 4014)
         Print("SagaRecord: add the site to Tools > Options > Expert Advisors > 'Allow WebRequest for listed URL'.");
      else
         Print("SagaRecord: WebRequest failed, error ", err);
      return(false);
     }

   if(status != 200)
     {
      PrintFormat("SagaRecord: the site refused the report, HTTP %d: %s",
                  status, CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      return(false);
     }
   return(true);
  }
//+------------------------------------------------------------------+
