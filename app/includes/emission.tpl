<main class="tab-pane active"
      ng-if="globalService.currentTab==globalService.tabs.emission.id"
      ng-controller='emissionCtrl'
      ng-cloak >

  <!-- Header : todo turn into warning notification-->
  <div class="alert alert-info" ng-show="hasQueryString">
    <p translate="WARN_Send_Link">
      You arrived via a link that has the address, amount, gas or data fields filled in for you. You can change any information before sending. Unlock your wallet to get started.
    </p>
  </div>


  <!-- Unlock Wallet -->
  <article class="collapse-container">
    <div class="row">
    <div class="col-xs-12 less-padding">
    <div ng-click="wd = !wd">
      <a class="collapse-button"><span ng-show="wd">+</span><span ng-show="!wd">-</span></a>
      <h1 translate="LIBRE_exchangeLibreCash">
        Exchange LibreCash
      </h1>
    </div>
    </div>
    </div>
    <div ng-show="!wd">
        @@if (site === 'cx' )  {  <cx-wallet-decrypt-drtv></cx-wallet-decrypt-drtv>   }
        @@if (site === 'mew' ) {  <wallet-decrypt-drtv></wallet-decrypt-drtv>         }
    </div>
  </article>

  <!-- Send Tx Content -->
  <article class="row" ng-show="wallet!=null">
    <section ng-hide="state == states.LOCKED">
      @@if (site === 'mew' ) { @@include( './emission-content.tpl', { "site": "mew" } ) }
      @@if (site === 'cx'  ) { @@include( './emission-content.tpl', { "site": "cx"  } ) }

      @@if (site === 'mew' ) { @@include( './tx-modal.tpl',   { "site": "mew" } ) }
      @@if (site === 'cx'  ) { @@include( './tx-modal.tpl',   { "site": "cx"  } ) }
    </section>
    <section ng-show="state == states.LOCKED" translate="LIBRE_exchangerLocked">
      The exchanger is locked
    </section>
  </article>


</main>
