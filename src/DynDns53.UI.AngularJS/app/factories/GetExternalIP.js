

app.factory('GetExternalIP', function ($http) {
  return $http.get('https://67ml6xrmha.execute-api.eu-west-1.amazonaws.com/dev', { cache: false });
});