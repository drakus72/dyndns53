using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynDns53.Core
{
    public interface IIpChecker
    {
        string GetExternalIp();
        Task<string> GetExternalIpAsync();
    }
}
