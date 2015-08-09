using DynDns53.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Service
{
    public class ScheduledTaskWorker
    {
        private DnsUpdater _dnsUpdater;

        public ScheduledTaskWorker(DnsUpdater dnsUpdater)
        {
            _dnsUpdater = dnsUpdater;
        }
        
        public void Run()
        {
            Console.WriteLine("Running DNS updates..." + DateTime.Now.ToString());

            _dnsUpdater.Update();

            Console.WriteLine("Finished updating" + DateTime.Now.ToString());
        }
    }
}
