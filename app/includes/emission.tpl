<main class="tab-pane active"
      ng-if="globalService.currentTab==globalService.tabs.emission.id"
      ng-controller='emissionCtrl'
      ng-cloak >
  <table class="table" ng-show="!(bankState.error || timeUpdateRequest.error || queuePeriod.error)" class="ng-hide">
    <tr>
      <td>Разрешена покупка</td>
      <td>{{ bankState.data[0] == 3 || then < now ? "Да" : "Нет" }}</td>
    </tr>
    <tr>
      <td>Статус контракта банка</td>
      <td>{{ bankState.error ? bankState.message : bankState.data[1] }}</td>
    </tr>
    <tr>
      <td>Последний запрос обновления курсов</td>
      <td>{{ timeUpdateRequest.data[1] }}</td>
    </tr>
    <tr>
      <td>Период разгребания очереди</td>
      <td>{{ queuePeriod.data[0] }} <span>секунд</span></td>
    </tr>
  </table>
  <table class="table" ng-show="bankState.error || timeUpdateRequest.error || queuePeriod.error" class="ng-hide">
    <tr ng-show="bankState.error" ng-cloak>
      <td>Ошибка получения статуса контракта</td>
      <td>{{ bankState.message }}</td>
    </tr>
    <tr ng-show="timeUpdateRequest.error" ng-cloak>
      <td>Ошибка получения переменной</td>
      <td>{{ timeUpdateRequest.message }}</td>
    </tr>
    <tr ng-show="queuePeriod.error" ng-cloak>
      <td>Ошибка получения переменной</td>
      <td>{{ queuePeriod.message }}</td>
    </tr>
  </table>
  <!-- Header : todo turn into warning notification-->
  <div class="alert alert-info" ng-show="hasQueryString">
    <p translate="WARN_Send_Link">
      You arrived via a link that has the address, amount, gas or data fields filled in for you. You can change any information before sending. Unlock your wallet to get started.
    </p>
  </div>


  <!-- Unlock Wallet -->
  <article class="collapse-container">
    <div ng-click="wd = !wd">
      <a class="collapse-button"><span ng-show="wd">+</span><span ng-show="!wd">-</span></a>
      <h1 translate="LBT_buyLibreCash">
        Buy LibreCash
      </h1>
    </div>
    <div ng-show="!wd">
        @@if (site === 'cx' )  {  <cx-wallet-decrypt-drtv></cx-wallet-decrypt-drtv>   }
        @@if (site === 'mew' ) {  <wallet-decrypt-drtv></wallet-decrypt-drtv>         }
    </div>
  </article>


  <!-- Send Tx Content -->
  <article class="row" ng-show="wallet!=null">
    @@if (site === 'mew' ) { @@include( './emission-content.tpl', { "site": "mew" } ) }
    @@if (site === 'cx'  ) { @@include( './emission-content.tpl', { "site": "cx"  } ) }

    @@if (site === 'mew' ) { @@include( './emission-modal.tpl',   { "site": "mew" } ) }
    @@if (site === 'cx'  ) { @@include( './emission-modal.tpl',   { "site": "cx"  } ) }
  </article>


</main>
