<!-- Content -->
<div class="col-sm-8">
<!-- todo state is "" for several seconds when we come from status tab. do "loading"? -->
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
  <article class="block" ng-hide="wallet.type=='addressOnly'" ng-show="buy">
    <nav class="container nav-container" ng-show="state == states.PROCESSING_ORDERS">
      <div class="nav-scroll">
      <ul class="nav-inner">
        <li class="nav-item {{ buyOrSell ? 'active' : '' }}" ng-click="buyOrSell=!buyOrSell"><a translate="LIBRE_buyDirection">ETH -> Libre</a></li>
        <li class="nav-item {{ buyOrSell ? '' : 'active' }}" ng-click="buyOrSell=!buyOrSell"><a translate="LIBRE_sellDirection">Libre -> ETH</a></li>
      </ul>
      </div>
    </nav>

    <section  class="row form-group" ng-show="state != states.PROCESSING_ORDERS &&
                                              state != states.WAIT_ORACLES &&
                                              state != states.REQUEST_RATES &&
                                              state != states.CALC_RATES">
                                                Loading contract data...
                                            </section>
    <!-- buy/sell section -->
    <section class="row form-group" ng-show="state == states.PROCESSING_ORDERS">
      <div class="col-sm-11">
          <strong translate="LIBRE_contracts">
              Contracts
          </strong>
      </div>
      <div class="col-sm-11">
        <p>
          <span>LibreBank</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', bankAddress) }}" target="_blank" rel="noopener noreferrer">{{ bankAddress }}</a>
        </p>
        <p>
          <span>LibreCash</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', cashAddress) }}" target="_blank" rel="noopener noreferrer">{{ cashAddress }}</a>
        </p>
        <p>
          <span translate="LIBRE_checkLegit">Please, check contracts legitimity.</span>
        </p>
      </div>
      <div class="col-sm-11">
        <p>
          <span>Buy rate</span>: {{ buyRate }}
        </p>
        <p>
          <span>Sell rate</span>: {{ sellRate }}
        </p>
        <p>
          <span>Rates are actual for</span>: {{ rateActualTime | secondsToDateTime | date:'HH:mm:ss' }}
        </p>
      </div>
      <div class="col-sm-11">
        <span>Contract balances</span>:<br/>
        {{ tokenBalance | number: 3 }} Libre<br/>
        {{ ethBalance | number: 3 }} ETH
        <!-- todo hours, minutes + translation -->
      </div>
      
      <!-- buy section -->
      <section ng-show="buyOrSell">
        <div class="col-sm-11">
          <label translate="LIBRE_buyDirection">
            ETH  -> Libre
          </label>
        </div>
        <div class="col-sm-11">
          <div class="input-group">
            <input type="text"
                    class="form-control"
                    placeholder="{{ 'SEND_amount_short' | translate }}"
                    ng-model="buyTXValue"
                    ng-disabled="tx.readOnly || checkTxReadOnly"
                    ng-class="Validator.isPositiveNumber(buyTXValue) ? 'is-valid' : 'is-invalid'"
                    ng-change="changedTokens = Validator.isPositiveNumber(buyTXValue) ? buyTXValue * buyRate : 0"/>
            <div class="input-group-btn">
              <span style="min-width: 170px"
                    class="btn btn-default"
                    ng-class="'disabled'">
                    <strong>
                      {{ changedTokens }} Libre
                    </strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Amount to Send - Transfer Entire Balance -->
        <p class="col-xs-12" ng-hide="tx.readOnly">
          <a ng-click="transferAllBalance()">
            <span class="strong" translate="SEND_TransferTotal">
              Send Entire Balance
            </span>
          </a>
        </p>

        <div class="col-sm-4">
          <button style="min-width: 170px"
              class="btn btn-default"
              data-toggle="modal"
              data-target="#buyTx"
              ng-disabled="buyPending || !orderAllowed || !Validator.isPositiveNumber(buyTXValue) || changedTokens > tokenBalance">
            <strong>
              {{ buyPending ? 'LIBRE_txPending' : 'LIBRE_buy' | translate }}
            </strong>
          </button>
        </div>
      </section>
      <!-- end buy section -->
      <!-- sell section -->
      <section ng-hide="buyOrSell">
        <div class="col-sm-11">
          <label translate="LIBRE_sellDirection">
            Libre -> ETH
          </label>
        </div>
        <p class="col-xs-12">
          <span translate="LIBRE_allowed">Allowed: </span><span>{{ allowedTokens | number: 3 }}</span>
          <br/>
          <span>All tokens: </span><span>{{ allTokens | number: 3 }}</span>
        </p>
        <div ng-show="allTokens == 0" class="col-sm-11">
          <strong translate="LIBRE_noTokens">
            No tokens on balance
          </strong>
        </div>
        <div ng-hide="allTokens == 0">
          <div class="col-sm-11" ng-hide="tx.readOnly">
            <label translate="LIBRE_allowance">
              Allowance
            </label>
          </div>
          <div class="col-sm-11">
            <div class="input-group">
              <input type="text"
                      class="form-control"
                      placeholder="{{ allTokens | number: 3 }}"
                      ng-model="tokensToAllow"
                      ng-disabled="tx.readOnly || checkTxReadOnly"
                      ng-class="Validator.isPositiveNumber(tokensToAllow) ? 'is-valid' : 'is-invalid'"/>
              <div class="input-group-btn">
                <button style="min-width: 170px"
                  class="btn btn-default"
                  ng-disabled="approvePending || !Validator.isPositiveNumber(tokensToAllow)"
                  ng-click="generateApproveTx()">
                  <strong>
                    {{ approvePending ? 'LIBRE_txPending' : 'LIBRE_approve' | translate }}
                  </strong>
                </button>
              </div>
            </div>
          </div>
          <p class="col-xs-12" ng-hide="tx.readOnly">
            <a ng-click="tokensToAllow = allTokens">
              <span class="strong" translate="LIBRE_approveAll">
                Approve whole balance
              </span>
            </a>
          </p>
        
          <section ng-hide="allowedTokens > 0">
            <div class="col-sm-11">
              <label>
                You need to approve some tokens before selling them
              </label>
            </div>
          </section>
          <!-- sell section after allowance -->
          <section ng-show="allowedTokens > 0">
            <div class="col-sm-11">
              <label translate="LIBRE_sellTokens">
                Tokens to Sell:
              </label>
            </div>
          
            <div class="col-sm-11">
              <div class="input-group">
                <input type="text"
                        class="form-control"
                        placeholder="{{ 'SEND_amount_short' | translate }}"
                        ng-model="tokenValue"
                        ng-disabled="tx.readOnly || checkTxReadOnly"
                        ng-class="Validator.isPositiveNumber(tokenValue) ? 'is-valid' : 'is-invalid'"
                        ng-change="changedEth = Validator.isPositiveNumber(tokenValue) ? tokenValue / sellRate : 0"/>
                <div class="input-group-btn">
                  <span style="min-width: 170px"
                        class="btn btn-default"
                        ng-class="'disabled'">
                          <strong>
                            {{ changedEth }} ETH
                          </strong>
                  </span>
                </div>
              </div>
            </div>
          
                <!-- Amount to Send - Transfer Entire Balance -->
            <p class="col-xs-12" ng-hide="tx.readOnly">
              <a ng-click="tokenValue = (allowedTokens <= allTokens) ? allowedTokens : allTokens; changedEth = tokenValue / sellRate">
                <span class="strong" translate="LIBRE_sellAllApproved">
                  Sell All Available Tokens
                </span>
              </a>
            </p>
          
            <div class="col-sm-8 offset-col-sm-2">
              <button style="min-width: 170px"
                class="btn btn-default"
                data-toggle="modal"
                data-target="#sellTx"
                ng-disabled="sellPending || !orderAllowed || !Validator.isPositiveNumber(tokenValue) || changedEth > ethBalance">
                <strong>
                  {{ sellPending ? 'LIBRE_txPending' : 'LIBRE_sell' | translate }}
                </strong>
              </button>
            </div>
          </section><!-- end sell section after allowance -->
        </div>
      </section><!-- end sell section -->
    </section><!-- end buy/sell section -->
    <section ng-show="state == states.WAIT_ORACLES">
      <div class="col-sm-11">
        Rate information processing from the oracles...
      </div>
      <div class="col-sm-11">
        {{ readyOracles }} of {{ oracleCount }} oracles have received data
      </div>
      <div class="col-sm-11">
        Timeout: {{ waitOraclesRemains | secondsToDateTime | date:'HH:mm:ss' }} remains
      </div>
      <div class="col-sm-11">&nbsp;</div>
      <div class="col-sm-11">
        Calculating rates is possible when:
        <ul>
          <li>every oracle gets actual data</li>
          <li>or timeout and at least {{ MIN_READY_ORACLES }} oracles get actual data</li>
        </ul>
      </div>
    </section>
  
    <section ng-show="state == states.REQUEST_RATES">
      <div class="col-sm-11" ng-show="RURAllowed">
        <span translate="LIBRE_RURCost">Update rates cost</span>: {{ RURCost }} ETH
      </div>

      <div class="col-sm-5">
        <button class="btn btn-block"
              data-toggle="modal"
              data-target="#urTx"
              ng-click="estimateRURTx()"
              ng-class="RURAllowed ? 'btn-success' : 'btn-default'"
              ng-disabled="(RURPending || CRPending) || !RURAllowed">
          {{ RURPending ? 'LIBRE_txPending' : 'LIBREFORCE_RUR' | translate }}
        </button>
      </div>
    </section>

    <section ng-show="state == states.CALC_RATES">
      <div class="col-sm-11">
        <label>
          Oracles have actual data. You need to initiate calculating buy and sell rates
        </label>
      </div>
      <div class="col-sm-11">
        <label>
            {{ readyOracles }} oracles of {{ oracleCount }} have actual data now. Each oracle's data is actual for 10 minutes. You need at least {{ MIN_READY_ORACLES }} actual oracles to calculate rates
        </label>
      </div>
      <div class="col-sm-5">
        <button class="btn btn-block"
              ng-click="generateCRTx()"
              ng-class="CRAllowed ? 'btn-success' : 'btn-default'"
              ng-disabled="(RURPending || CRPending) || !CRAllowed">
          {{ CRPending ? 'LIBRE_txPending' : 'LIBREFORCE_CR' | translate }}
        </button>
      </div>
    </section>
    <section ng-show="deadlineRemains != 0"><!-- deadline section -->
      <div class="col-sm-11">
        <label>
          Contract deadline in {{ deadlineDays }} {{ 'LIBRE_days' | translate }} {{ deadlineRemains | secondsToDateTime | date:'HH:mm:ss' }}
        </label>
      </div>
    </section>
  </article>

</div>
<!-- / Content -->





<!-- Sidebar -->
<section class="col-sm-4">

  <div class="block block--danger"
       ng-show="wallet!=null && globalService.currentTab==globalService.tabs.swap.id && !hasEnoughBalance()">

    <h5 translate="SWAP_Warning_1">
      Warning! You do not have enough funds to complete this swap.
    </h5>

    <p translate="SWAP_Warning_2">
      Please add more funds to your wallet or access a different wallet.
    </p>

  </div>

  <wallet-balance-drtv></wallet-balance-drtv>

  <div ng-show="checkTxPage"
       ng-click="checkTxReadOnly=!checkTxReadOnly"
       class="small text-right text-gray-lighter">
        <small translate="X_Advanced">
          Advanced Users Only.
        </small>
  </div>

</section>
<!-- / Sidebar -->
