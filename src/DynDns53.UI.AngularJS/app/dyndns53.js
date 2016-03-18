var app = angular.module('dyndns53App', ['timer', 'ngMessages']);

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

app.directive('domainListChecks', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$validators.emptyDomainList = function(modelValue, viewValue) {
        if (modelValue.domains.length > 0) {
          return true;
        }
        return false;
      };

      ctrl.$validators.nameAndZoneIdRequired = function(modelValue, viewValue) {
        // var nonEmptyEntries = modelValue.domains.filter(function(el){ return el.name && el.zoneId; });
        // return (nonEmptyEntries.length == modelValue.domains.length);
        return true;
      };

    }
  };
});


app.controller('UsageController', ['$scope', 'LocalStorage', function($scope, LocalStorage) {
  if (LocalStorage.getData('hideUsage') == null || LocalStorage.getData('hideUsage') == "undefined") {
    LocalStorage.setData('hideUsage', "false")
  }

  $scope.hideUsage = LocalStorage.getData('hideUsage');
  $scope.toggleUsageButtonText = ($scope.hideUsage == 'true') ? "Show usage" : "Hide usage";

  $scope.toggleUsage = function() {
    $scope.hideUsage = ($scope.hideUsage == 'true') ? 'false' : 'true';
    $scope.toggleUsageButtonText = ($scope.hideUsage == 'true') ? "Show usage" : "Hide usage";
    LocalStorage.setData('hideUsage', $scope.hideUsage)
  }
}]);

app.controller('SettingsController', ['$scope', '$rootScope', 'LocalStorage', function($scope, $rootScope, LocalStorage) {
  if (LocalStorage.getData('formSaved') == null || LocalStorage.getData('formSaved') == "undefined") {
    LocalStorage.setData('formSaved', "false")
  }

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
    // broadcastConfig();
    
    
    var appConfig = {
      accessKey: $rootScope.accessKey,
      secretKey: $rootScope.secretKey,
      updateInterval: $rootScope.updateInterval,
      domainList: $rootScope.domainList
    };

    $rootScope.$broadcast('config-updated', appConfig);
    console.log('config-updatedxx');
  };

  $scope.saveValues = function() {
    LocalStorage.setData('updateInterval', $rootScope.updateInterval)
    LocalStorage.setData('maxLogRowCount', $rootScope.maxLogRowCount)
    LocalStorage.setData('accessKey', $rootScope.accessKey)
    LocalStorage.setData('secretKey', $rootScope.secretKey)
    LocalStorage.setData('domainList', JSON.stringify($rootScope.domainList))
    LocalStorage.setData('formSaved', "true")
    $rootScope.$emit('rootScope:log', 'Saved configuration values to the local storage');
    broadcastConfig();
  };

  function broadcastConfig() {
    var appConfig = {
      accessKey: $rootScope.accessKey,
      secretKey: $rootScope.secretKey,
      updateInterval: $rootScope.updateInterval,
      domainList: $rootScope.domainList
    };

    $rootScope.$broadcast('config-updated', appConfig);
    console.log('config-updated');
  }

  $scope.addDomain = function() {
    $rootScope.domainList.domains.push({ 'name': '', 'zoneId': '' })
    $scope.settingsForm.domainListHidden.$validate();
  };

  $scope.deleteDomain = function(index) {
    $rootScope.domainList.domains.splice(index, 1);
    $scope.settingsForm.domainListHidden.$validate();
  };

  $scope.domainsUpdated = function() {
    $scope.settingsForm.domainListHidden.$validate();
  }
}]);


app.controller('UpdateController', ['$scope', '$rootScope', '$http', 'GetExternalIP', '$interval', 'LocalStorage', function($scope, $rootScope, $http, GetExternalIP, $interval, LocalStorage) {

  $scope.formSaved = LocalStorage.getData('formSaved') === "true";
  console.log($scope.formSaved);

  var appConfig;

  intervalfunc = function(){ 
    $scope.$broadcast('auto-update-timer-restart');
    $scope.updateAllDomains();
  }

  $scope.$on('config-updated', function (event, data) {
    console.log('on-form-saved');
    $scope.formSaved = true;

    appConfig = data;
    console.log(appConfig);
  });

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
      intervalPromise = $interval(intervalfunc, (appConfig.updateInterval * 60 * 1000));
      $scope.$broadcast('auto-update-start');
      var logMessage = "Starting auto-update at every: " + appConfig.updateInterval + " minutes";
      $rootScope.$emit('rootScope:log', logMessage);
    }
  }

  $scope.updateAllDomains = function() {
    angular.forEach(appConfig.domainList.domains, function(value, key) {
      $scope.updateDomainInfo(value.name, value.zoneId);
    });
  }

  $scope.updateDomainInfo = function(domainName, zoneId) {
    var options = {
      'accessKeyId': appConfig.accessKey,
      'secretAccessKey': appConfig.secretKey
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
      'accessKeyId': appConfig.accessKey,
      'secretAccessKey': appConfig.secretKey
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
  var appConfig;

  $scope.$on('form-saved', function (event, data) {
    appConfig = data;
    console.log('TimerController');
  });

  $scope.$on('auto-update-start', function (event, data) {
      $scope.countdown = appConfig.updateInterval * 60
      $scope.$broadcast('timer-reset');
      $scope.$broadcast('timer-add-cd-seconds', appConfig.countdown);
    });

  $scope.$on('auto-update-stop', function (event, data) {
      $scope.$broadcast('timer-reset');
    });

  $scope.$on('auto-update-timer-restart', function (event, data) {
      $scope.countdown = appConfig.updateInterval * 60
      $scope.$broadcast('timer-reset');
      $scope.$broadcast('timer-add-cd-seconds', appConfig.countdown);
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




