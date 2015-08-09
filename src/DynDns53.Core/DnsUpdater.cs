using Amazon.Route53;
using Amazon.Route53.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Core
{
    public class DnsUpdater
    {
        private IConfigHandler _configHandler;
        private IIpChecker _ipChecker;
        private IAmazonRoute53 _amazonClient;

        public DnsUpdater(IConfigHandler configHandler, IIpChecker ipchecker, IAmazonRoute53 amazonClient)
        {
            _configHandler = configHandler;
            _ipChecker = ipchecker;
            _amazonClient = amazonClient;
        }

        public void Update()
        {
            var config = _configHandler.GetConfig();
            string currentExternalIp = _ipChecker.GetExternalIp();

            foreach (var domain in config.DomainList)
            {
                string subdomain = domain.DomainName;
                string zoneId = domain.ZoneId;

                var listResourceRecordSetsResponse = _amazonClient.ListResourceRecordSets(new ListResourceRecordSetsRequest() { HostedZoneId = zoneId });
                var resourceRecordSet = listResourceRecordSetsResponse.ResourceRecordSets.First(recordset => recordset.Name == subdomain);
                var resourceRecord = resourceRecordSet.ResourceRecords.First();

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
