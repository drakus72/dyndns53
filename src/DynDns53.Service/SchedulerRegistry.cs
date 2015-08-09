using FluentScheduler;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Service
{
    public class SchedulerRegistry : Registry
    {
        public SchedulerRegistry(ScheduledTaskWorker worker)
        {
            int interval = Int32.Parse(ConfigurationManager.AppSettings["UpdateInterval"]);

            Schedule(() =>
            {
                
                worker.Run();

            }).NonReentrant().ToRunNow().AndEvery(interval).Minutes();
        }
    }
}
