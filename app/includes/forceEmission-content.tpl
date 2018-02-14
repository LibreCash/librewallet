<!-- Content -->
<div class="col-sm-8">

    <!-- If unlocked with address only -->
    <article class="block" ng-show="wallet.type=='addressOnly'">
      <div class="row form-group">
        <h4 translate="SEND_ViewOnly">
          You cannot send with only your address. You must use one of the other options to unlock your wallet in order to send.
        </h4>
        <h5 translate="X_HelpfulLinks">
          Helpful Links &amp; FAQs
        </h5>
        <ul>
          <li class="u__protip">
            <a href="https://myetherwallet.github.io/knowledge-base/getting-started/accessing-your-new-eth-wallet.html"
               target="_blank"
               rel="noopener noreferrer"
               translate="X_HelpfulLinks_1">
                  How to Access your Wallet
            </a>
          </li>
          <li class="u__protip">
            <a href="https://myetherwallet.github.io/knowledge-base/private-keys-passwords/lost-eth-private-key.html"
               target="_blank"
               rel="noopener noreferrer"
               translate="X_HelpfulLinks_2">
                  I lost my private key
            </a>
          </li>
          <li class="u__protip">
            <a href="https://myetherwallet.github.io/knowledge-base/private-keys-passwords/accessing-different-address-same-private-key-ether.html"
               target="_blank"
               rel="noopener noreferrer"
               translate="X_HelpfulLinks_3">
                  My private key opens a different address
            </a>
          </li>
          <li class="u__protip">
            <a href="https://myetherwallet.github.io/knowledge-base/migration/"
               target="_blank"
               rel="noopener noreferrer"
               translate="X_HelpfulLinks_4">
                  Migrating to/from MyEtherWallet
            </a>
          </li>
        </ul>
      </div>
    </article>
  
    <!-- If unlocked with PK -->
    <article class="block" ng-hide="wallet.type=='addressOnly'">
  
      <section class="row form-group">
        <table class="table">
          <tbody>
            <tr>
              <td translate="LIBREFE_LBStatus">LibreBank status:</td>
              <td>{{ bankState.error ? bankState.msg : bankState.data[1] }}
              </td>
            </tr>
            <tr>
              <td translate="LIBREFE_LastBlockTime">Last block time:</td>
              <td>{{ lastBlock }}</td>
            </tr>
            <tr>
              <td translate="LIBREFE_LastUpdate">Last update:</td>
              <td>{{ timeUpdateRequest.error ? timeUpdateRequest.msg : timeUpdateRequest.data[1] }}</td>
            </tr>
            <tr>
              <td translate="LIBREFE_RelevancePeriod">Relevance period:</td>
              <td>{{ relevancePeriod.error ? relevancePeriod.msg : relevancePeriod.data[0] }}</td>
            </tr>      
            <tr>
              <td translate="LIBREFE_QueuePeriod">Queue processing period:</td>
              <td>{{ queuePeriod.error ? queuePeriod.msg : queuePeriod.data[0] }}</td>
            </tr>      
            <tr>
              <td translate="LIBREFE_Paused">Paused:</td>
              <td>{{ contractPaused }}</td>
            </tr>      
            <tr>
                <td translate="LIBREFE_ReadyOracles">Ready oracles:</td>
                <td>{{ readyOracles }} / {{ enabledOracles }}</td>
            </tr>
            <tr>
                <td translate="LIBREFE_RURCost">Request Rates cost:</td>
                <td>{{ rurCost }} ETH + gas</td>
            </tr>     
        </tbody>
        </table>
  
        <div class="col-sm-5">
          <a class="btn btn-block"
                ng-click="generateRURTx()"
                ng-class="RURAllowed ? 'btn-success' : 'btn-default'"
                ng-disabled="RURPending || CRPending">
            {{ RURPending ? 'LIBRE_txPending' : 'LIBREFORCE_RUR' | translate }}
          </a>
        </div>
        <div class="col-sm-5">
          <a class="btn btn-block"
                ng-click="generatePBUYTx()"
                ng-class="queuesAllowed ? 'btn-success' : 'btn-default'"
                ng-disabled="RURPending || CRPending || PBuyPending">
            {{ PBuyPending ? 'LIBRE_txPending' : 'LIBREFORCE_PBUY' | translate }}
          </a>
        </div>
        <div class="col-sm-5">
          <a class="btn btn-block"
                ng-click="generateCRTx()"
                ng-class="CRAllowed ? 'btn-success' : 'btn-default'"
                ng-disabled="RURPending || CRPending">
            {{ CRPending ? 'LIBRE_txPending' : 'LIBREFORCE_CR' | translate }}
          </a>
        </div>
        <div class="col-sm-5">
          <a class="btn btn-block"
                ng-click="generatePSELLTx()"
                ng-class="queuesAllowed ? 'btn-success' : 'btn-default'"
                ng-disabled="RURPending || CRPending || PSellPending">
            {{ PSellPending ? 'LIBRE_txPending' : 'LIBREFORCE_PSELL' | translate }}
          </a>
        </div>
  
      </section>
  
    </article>
  
  </div>
  <!-- / Content -->  