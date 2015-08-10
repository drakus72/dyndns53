
![](https://s3-eu-west-1.amazonaws.com/vp-projects-img/Dd53_small.png)

# DynDns53

DynDns53 is a dynamic DNS tool using AWS Route 53. Your domain needs to be hosted Route53. It has WPF user interface and a Windows Service component that perform the same task. WPF application can be started at system startup as well. 

## Usage

The project has a WPF user interface and a Windows service. Both are using the same library (DynDns53.Core) so the functionality is the same. Using the user interface is pretty straightforward.     

![](https://s3-eu-west-1.amazonaws.com/vpblogimg/2015/08/dyndns53-mainwindow.png)

Just add your AWS keys that have access privileges to your domains. You can set it to run at system start so you don't have to start it manually.

![](https://s3-eu-west-1.amazonaws.com/vpblogimg/2015/08/dyndns53-seetings-window.png)

 
I built the Windows service using Topshelf. To install it, build the application and on an elevated command prompt just run

```
DynDns53.Service.exe install
``` 

Similarly to uninstall:

```
DynDns53.Service.exe uninstall
``` 


# Links 

* [Project website](http://dyndns53.com)

 
 


