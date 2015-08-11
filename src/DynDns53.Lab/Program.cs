using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon;
using Amazon.Route53;
using DynDns53.Core;
using System.Configuration;
using Amazon.Route53.Model;

namespace DynDns53.Lab
{
    public class Program
    {
        public static void Main(string[] args)
        {
            /*
            IConfigHandler _configHandler = new AppConfigHandler();
            var config = _configHandler.GetConfig();

            IIpChecker _ipChecker = new AwsIpChecker();
            IAmazonRoute53 _amazonClient = new AmazonRoute53Client(config.Route53AccessKey, config.Route53SecretKey, RegionEndpoint.EUWest1);

            var dnsUpdater = new DnsUpdaterTestPad(_configHandler, _ipChecker, _amazonClient);
            dnsUpdater.Update().Wait();
            */



            var methodHost = new MethodHost();
            Task<long> result = methodHost.AsyncMethod();
            
            Console.WriteLine(result.Result);
            Console.WriteLine("EOF");
            Console.ReadLine();
        }

        
    }
}
