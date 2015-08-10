using Amazon;
using Amazon.Route53;
using Amazon.Route53.Model;
using DynDns53.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Lab
{
    public class MethodHost
    {
        public async Task<long> AsyncMethod()
        {
            IConfigHandler _configHandler = new AppConfigHandler();
            var config = _configHandler.GetConfig();

            IAmazonRoute53 _amazonClient = new AmazonRoute53Client(config.Route53AccessKey, config.Route53SecretKey, RegionEndpoint.EUWest1);
            var request = new GetHealthCheckCountRequest() { };
            var response = await _amazonClient.GetHealthCheckCountAsync(request);

            return response.HealthCheckCount;
        }
    }
}
