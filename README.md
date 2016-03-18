
![](https://s3-eu-west-1.amazonaws.com/vp-projects-img/DynDns53Logo_200x116.png)


# DynDns53

DynDns53 is a dynamic DNS tool using AWS Route 53. Your domains need to be hosted on AWS Route53. It has 3 clients:

* AngularJS
* WPF Client
* Windows Service

## AngularJS Client
The website for the client is at [https://dyndns53.com](https://dyndns53.com). You can simply enter your keys and domains here and start using it right away.

![](https://vp-projects-img.s3.amazonaws.com/dyndns53/dyndns53-angularjs-client-settings-and-event-log.png)

The keys are stored locally on the browser so nobody will have access to them.


## WPF Client 

The project has a WPF user interface and a Windows service. Both are using the same library (DynDns53.Core) so the functionality is the same. Using the user interface is pretty straightforward.     

![](https://s3-eu-west-1.amazonaws.com/vpblogimg/2015/08/dyndns53-mainwindow.png)

Just add your AWS keys that have access privileges to your domains. You can set it to run at system start so you don't have to start it manually.

![](https://s3-eu-west-1.amazonaws.com/vpblogimg/2015/08/dyndns53-settings-window.png)

WPF application can be started at system startup as well.

## Windows Service

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
* [Blog post introducing WPF client and Windows service](http://volkanpaksoy.com/archive/2015/08/12/dynamic-dns-with-aws-route53/)
* [Blog post introducing AngularJS client](http://volkanpaksoy.com/archive/2016/03/18/dynamic-dns-with-aws-route-53-part-2-angular-client/)

 


