using DynDns53.Core.Config;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Core
{
    public class AppConfigHandler : IConfigHandler
    {
        private DynDns53Config _config = null;

        public DynDns53Config GetConfig()
        {
            ConfigurationManager.RefreshSection("appSettings");
            ConfigurationManager.RefreshSection("awsSettings");
            ConfigurationManager.RefreshSection("domainSettings");


            _config = new DynDns53Config();

            string exeFile = System.Reflection.Assembly.GetCallingAssembly().Location;
            var configFile = ConfigurationManager.OpenExeConfiguration(exeFile);

            _config.UpdateInterval = int.Parse(ConfigurationManager.AppSettings["UpdateInterval"]);
            _config.ClientId = ConfigurationManager.AppSettings["ClientId"];
            _config.Route53AccessKey = AwsSettings.Settings.Route53AccessKey;
            _config.Route53SecretKey = AwsSettings.Settings.Route53SecretKey;
            _config.RunAtSystemStart = bool.Parse(ConfigurationManager.AppSettings["RunAtSystemStart"]);

            _config.DomainList = new List<HostedDomainInfo>();
            foreach (DomainElement domainInfo in DomainSettings.Settings.DomainList)
            {
                _config.DomainList.Add(new HostedDomainInfo() { DomainName = domainInfo.SubDomain, ZoneId = domainInfo.ZoneId });
            }
            
            return _config;
        }

        public void SaveConfig(DynDns53Config config)
        {
            string exeFileName = System.Reflection.Assembly.GetCallingAssembly().Location;
            var configFile = ConfigurationManager.OpenExeConfiguration(exeFileName);

            configFile.AppSettings.Settings.Remove("UpdateInterval");
            configFile.AppSettings.Settings.Add("UpdateInterval", config.UpdateInterval.ToString());

            configFile.AppSettings.Settings.Remove("RunAtSystemStart");
            configFile.AppSettings.Settings.Add("RunAtSystemStart", config.RunAtSystemStart.ToString());

            // AWS section
            var awsConfigSection = configFile.GetSection("awsSettings");
            awsConfigSection.ElementInformation.Properties["route53AccessKey"].Value = config.Route53AccessKey;
            awsConfigSection.ElementInformation.Properties["route53SecretKey"].Value = config.Route53SecretKey;

            // Domain info
            var domainConfigSection = configFile.GetSection("domainSettings") as DomainSettings;
            domainConfigSection.DomainList.Clear();

            foreach (var domain in config.DomainList)
            {
                domainConfigSection.DomainList.Add( new DomainElement() { SubDomain = domain.DomainName, ZoneId = domain.ZoneId } );
            }
            
            configFile.Save(ConfigurationSaveMode.Modified);
        }
    }
}
