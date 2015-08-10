using Amazon.Route53;
using Amazon.Route53.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Core
{
    public class DnsUpdaterTestPad
    {
        private IConfigHandler _configHandler;
        private IIpChecker _ipChecker;
        private IAmazonRoute53 _amazonClient;

        public DnsUpdaterTestPad(IConfigHandler configHandler, 
            IIpChecker ipchecker,
            IAmazonRoute53 amazonClient)
        {
            _configHandler = configHandler;
            _ipChecker = ipchecker;
            _amazonClient = amazonClient;
        }

        public async Task Update()
        {
            DynDns53Config config = _configHandler.GetConfig();
            Task<string> currentExternalIpTask = _ipChecker.GetExternalIpAsync();

            foreach (var domain in config.DomainList)
            {
                string subdomain = domain.DomainName;
                string zoneId = domain.ZoneId;

                ListResourceRecordSetsResponse listResourceRecordSetsResponse = _amazonClient.ListResourceRecordSets(new ListResourceRecordSetsRequest() { HostedZoneId = zoneId });
                ResourceRecordSet resourceRecordSet = listResourceRecordSetsResponse.ResourceRecordSets.First(recordset => recordset.Name == subdomain);
                ResourceRecord resourceRecord = resourceRecordSet.ResourceRecords.First();

                string currentExternalIp = await currentExternalIpTask;
                if (resourceRecord.Value != currentExternalIp)
                {
                    resourceRecord.Value = currentExternalIp;

                    _amazonClient.ChangeResourceRecordSets(new ChangeResourceRecordSetsRequest()
                    {
                        HostedZoneId = zoneId,
                        ChangeBatch = new ChangeBatch()
                        {
                            Changes = new List<Change>() 
                            { 
                                new Change(ChangeAction.UPSERT, resourceRecordSet)
                            }
                        }
                    });
                }
                
            }

        }

    }
}
