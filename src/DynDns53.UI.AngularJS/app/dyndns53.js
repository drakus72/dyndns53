var app = angular.module('dyndns53App', ['timer']);

app.run(function($rootScope) {
    
    $rootScope.logData = []
    $rootScope.logDataString = ""

    $rootScope.clearLog = function() {
      $rootScope.logData = []
      $rootScope.logDataString = ""
    }

    $rootScope.$on('rootScope:log', function (event, data) {
      var logLine = moment().format('D/MM/YYYY HH:mm:ss') + '\t' + data; //+ '\n';
      $rootScope.logData.unshift(logLine);
      $rootScope.logData = $rootScope.logData.slice(0, $rootScope.maxLogRowCount);
      $rootScope.logDataString = $rootScope.logData.join('\n');
    });
})

app.controller('SettingsController', ['$scope', '$rootScope', 'LocalStorage', function($scope, $rootScope, LocalStorage) {
    $scope.loadValues = function() {
       $rootScope.$emit('rootScope:log', 'Loading configuration values from the local storage');
       
       $rootScope.updateInterval = isNaN(parseInt(LocalStorage.getData('updateInterval'))) ? 5 : parseInt(LocalStorage.getData('updateInterval'));
       $rootScope.maxLogRowCount = isNaN(parseInt(LocalStorage.getData('maxLogRowCount'))) ? 50 : parseInt(LocalStorage.getData('maxLogRowCount'));
       $rootScope.accessKey = LocalStorage.getData('accessKey');
       $rootScope.secretKey = LocalStorage.getData('secretKey');
       $rootScope.domainList = JSON.parse(LocalStorage.getData('domainList'));
       if ($rootScope.domainList == null) {
          $rootScope.domainList = { "domains": [] }
       }
    };

    $scope.saveValues = function() {
      $rootScope.$emit('rootScope:log', 'Saving configuration values to the local storage');

      LocalStorage.setData('updateInterval', $rootScope.updateInterval)
      LocalStorage.setData('maxLogRowCount', $rootScope.maxLogRowCount)
      LocalStorage.setData('accessKey', $rootScope.accessKey)
      LocalStorage.setData('secretKey', $rootScope.secretKey)
      $scope.trimEmptyEntries();
      LocalStorage.setData('domainList', JSON.stringify($rootScope.domainList))
    };

    $scope.addDomain = function() {
      $rootScope.domainList.domains.push({ 'name': '', 'zoneId': '' })
    };

    $scope.deleteDomain = function (domainName) {
      $rootScope.domainList.domains = 
        $rootScope.domainList.domains.filter(function(el){ return el.name != domainName; });
    };

    $scope.trimEmptyEntries = function () {
      $rootScope.domainList.domains = 
        $rootScope.domainList.domains.filter(function(el){ return el.name != "" || el.zoneId != ""; });
    };    
}]);


app.controller('UpdateController', ['$scope', '$rootScope', '$http', 'GetExternalIP', '$interval', function($scope, $rootScope, $http, GetExternalIP, $interval) {
  
  var updating = false;

  intervalfunc = function(){ 
    $scope.$broadcast('auto-update-timer-restart');
    $scope.updateAllDomains(); 
  }

  $scope.toggleAutoUpdate = function() {
    if ($scope.updating) {
      // Stop
      $scope.updating = false;
      $interval.cancel(intervalPromise);
      $scope.$broadcast('auto-update-stop');
      var logMessage = "Stopping auto-update";
      $rootScope.$emit('rootScope:log', logMessage);
    } else {
      // Start
      $scope.updating = true;
      intervalPromise = $interval(intervalfunc, ($scope.updateInterval * 60 * 1000));
      $scope.$broadcast('auto-update-start');
      var logMessage = "Starting auto-update at every: " + $scope.updateInterval + " minutes";
      $rootScope.$emit('rootScope:log', logMessage);
    }
  }

  $scope.updateAllDomains = function() {
    angular.forEach($rootScope.domainList.domains, function(value, key) {
      $scope.updateDomainInfo(value.name, value.zoneId);
    });
  }

  $scope.updateDomainInfo = function(domainName, zoneId) {
    var options = {
      'accessKeyId': $rootScope.accessKey,
      'secretAccessKey': $rootScope.secretKey
    };
    var route53 = new AWS.Route53(options);
    
    var params = {
      HostedZoneId: zoneId
    };

    route53.listResourceRecordSets(params, function(err, data) {
        if (err) { 
          $rootScope.$emit('rootScope:log', err.message);
          $rootScope.$apply();
        } else {
          angular.forEach(data.ResourceRecordSets, function(value, key) {
              // console.log(value.ResourceRecords[0]);
              // console.log(key);
              if (value.Name.slice(0, -1) == domainName) {
                var externalIPAddress = "";
                GetExternalIP
                  .then(function(response) {
                     externalIPAddress = response.data.ip;
                     if (value.ResourceRecords[0].Value != externalIPAddress) {
                       $scope.changeIP(domainName, zoneId, externalIPAddress)
                     } else {
                        $rootScope.$emit('rootScope:log', 'IP address is up-to-date. Skipping update.');
                     }
                 });
              }
          });
        }
    });
  }

  $scope.changeIP = function(domainName, zoneId, newIPAddress) {
    var options = {
      'accessKeyId': $rootScope.accessKey,
      'secretAccessKey': $rootScope.secretKey
    };

    var route53 = new AWS.Route53(options);
    var params = {
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: domainName,
              Type: 'A',
              TTL: 300,
              ResourceRecords: [ {
                  Value: newIPAddress
                }
              ]
            }
          }
        ]
      },
      HostedZoneId: zoneId
    };

    route53.changeResourceRecordSets(params, function(err, data) {
      if (err) { 
        $rootScope.$emit('rootScope:log', err.message); 
      }
      else { 
        var logMessage = "Updated domain: " + domainName + " ZoneID: " + zoneId + " with IP Address: " + newIPAddress;
        $rootScope.$emit('rootScope:log', logMessage);
      }

      $rootScope.$apply();
    });
  }
}]);

app.controller('TimerController', ['$scope', '$rootScope', function($scope, $rootScope) {
  $scope.$on('auto-update-start', function (event, data) {
      $scope.countdown = $scope.updateInterval * 60
      $scope.$broadcast('timer-reset');
      $scope.$broadcast('timer-add-cd-seconds', $scope.countdown);
    });

  $scope.$on('auto-update-stop', function (event, data) {
      $scope.$broadcast('timer-reset');
    });

  $scope.$on('auto-update-timer-restart', function (event, data) {
      $scope.countdown = $scope.updateInterval * 60
      $scope.$broadcast('timer-reset');
      $scope.$broadcast('timer-add-cd-seconds', $scope.countdown);
    });
}]);

app.factory('GetExternalIP', function ($http) {
  return $http.get('https://67ml6xrmha.execute-api.eu-west-1.amazonaws.com/dev', { cache: false });
});

app.factory("LocalStorage", function($window, $rootScope) {
  return {
    setData: function(key, val) {
      $window.localStorage && $window.localStorage.setItem(key, val);
      return this;
    },
    getData: function(key) {
      return $window.localStorage && $window.localStorage.getItem(key);
    }
  };
});


