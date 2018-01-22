<!--table class="table" ng-show="!(bankState.error || timeUpdateRequest.error || queuePeriod.error)" class="ng-hide">
    <tr>
      <td translate="LIBRESTATUS_allowed">Orders allowed</td>
      <td>{{ bankState.data[0] == 3 || then < now ? "Да" : "Нет" }}</td>
    </tr>
    <tr>
      <td translate="LIBRESTATUS_status">Bank contract status</td>
      <td>{{ bankState.error ? bankState.message : bankState.data[1] }}</td>
    </tr>
    <tr>
      <td translate="LIBRESTATUS_lastUpdate">Last update request time</td>
      <td>{{ timeUpdateRequest.data[1] }}</td>
    </tr>
    <tr>
      <td translate="LIBRESTATUS_queuePeriod">Queue processing period</td>
      <td>{{ queuePeriod.data[0] }} <span translate="LIBRESTATUS_seconds">seconds</span></td>
    </tr>
  </table>
  <table class="table" ng-show="bankState.error || timeUpdateRequest.error || queuePeriod.error" class="ng-hide">
    <tr ng-show="bankState.error" ng-cloak>
      <td translate="LIBRESTATUS_errorStatus">Error getting contract status</td>
      <td>{{ bankState.message }}</td>
    </tr>
    <tr ng-show="timeUpdateRequest.error" ng-cloak>
      <td translate="LIBRESTATUS_errorVar">Error getting contract variable(s)</td>
      <td>{{ timeUpdateRequest.message }}</td>
    </tr>
    <tr ng-show="queuePeriod.error" ng-cloak>
      <td translate="LIBRESTATUS_errorVar">Error getting contract variable(s)</td>
      <td>{{ queuePeriod.message }}</td>
    </tr>
  </table-->