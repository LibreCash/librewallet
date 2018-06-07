<!-- Content -->
<div class="col-sm-8 less-paddings-mobile">
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
  <section  class="row form-group" ng-show="state != states.PROCESSING_ORDERS &&
                                              state != states.WAIT_ORACLES &&
                                              state != states.REQUEST_RATES &&
                                              state != states.CALC_RATES"
                                              translate="LIBRE_loadingContractData">
                                                Loading contract data...
                                            </section>
      
    <div class="tab-content__inner" ng-show="state == states.PROCESSING_ORDERS">
      <nav class="bank-status-nav">
        <ul class="bank-status-nav__list">
          <li class="bank-status-nav__item  {{ buyOrSell ? 'active' : '' }}" ng-click="buyOrSell=!buyOrSell"><a translate="LIBRE_buyDirection">ETH -> Libre</a></button>
          <li class="bank-status-nav__item {{ buyOrSell ? '' : 'active' }}" ng-click="buyOrSell=!buyOrSell"><a translate="LIBRE_sellDirection">Libre -> ETH</a></button>
        </ul>
      </nav>
    </div>  
    <!-- buy/sell section -->
    <section class="row form-group" ng-show="state == states.PROCESSING_ORDERS">
      <div class="col-sm-11">
          <strong translate="LIBRE_contracts">
              Contracts
          </strong>
      </div>
      <div class="col-sm-11">
        <p>
          <span translate="LIBRE_exchanger">Exchanger</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', bankAddress) }}" target="_blank" rel="noopener noreferrer">{{ bankAddress }}</a>
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
          <span translate="LIBRE_buyRate">Buy rate</span>: {{ buyRate }}
        </p>
        <p>
          <span translate="LIBRE_sellRate">Sell rate</span>: {{ sellRate }}
        </p>
        <p>
          <span translate="LIBRE_whenActual">Rates are actual for</span>: {{ rateActualTime | secondsToDateTime | date:'HH:mm:ss' }}
        </p>
      </div>
      <div class="col-sm-11">
        <span translate="LIBRE_contractBalance">Contract balance</span>:
        <p></p>{{ ethBalance | number: 3 }} ETH</p>
      </div>

      <!-- buy section -->
      <section ng-show="buyOrSell">
 
        <div class="col-sm-11">
          <div class="input-group input-group--flex">
            <input type="text"
                    class="form-control"
                    placeholder="{{ 'SEND_amount_short' | translate }}"
                    ng-model="buyTXValue"
                    ng-disabled="tx.readOnly || checkTxReadOnly"
                    ng-class="Validator.isPositiveNumber(buyTXValue) ? 'is-valid' : 'is-invalid'"
                    ng-change="changedTokens = Validator.isPositiveNumber(buyTXValue) ? buyTXValue * buyRate : 0"/>
                    <div class="input-group-btn">
              <span 
                    class="btn btn-std btn-default btn-inside-input"
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
            <span class="strong underline" translate="SEND_TransferTotal">
              Send Entire Balance
            </span>
          </a>
        </p>

        <div class="col-sm-11">
          <button
              class="btn btn-std"
              ng-class="buyPending || !orderAllowed || !Validator.isPositiveNumber(buyTXValue) ?
                'btn-default' : 'btn-success'"
              ng-click="buyModal()"
              ng-disabled="buyPending || !orderAllowed || !Validator.isPositiveNumber(buyTXValue)">
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
          <span translate="LIBRE_allowed">Allowed:</span> {{ allowedTokens | number: 3 }}
          <br/>
          <span translate="LIBRE_allTokens">All tokens:</span> {{ allTokens | number: 3 }}
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
            </div>
          </div>
          <p class="col-xs-12" ng-hide="tx.readOnly">
            <a ng-click="tokensToAllow = allTokens">
              <span class="strong underline" translate="LIBRE_approveAll">
                Approve whole balance
              </span>
            </a>
          </p>
          <div class="col-sm-11 offset-col-sm-2">
            <button
              class="btn btn-std"
              ng-class="approvePending || !Validator.isPositiveNumber(tokensToAllow) ? 'btn-default' : 'btn-success'"
              ng-disabled="approvePending || !Validator.isPositiveNumber(tokensToAllow)"
              ng-click="approveModal()">
              <strong>
                {{ approvePending ? 'LIBRE_txPending' : 'LIBRE_approve' | translate }}
              </strong>
            </button>
          </div>
        
          <section ng-hide="allowedTokens > 0">
            <div class="col-sm-11">
              <label translate="LIBRE_needApprove">
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
              <div class="input-group input-group--flex">
                <input type="text"
                        class="form-control"
                        placeholder="{{ 'SEND_amount_short' | translate }}"
                        ng-model="tokenValue"
                        ng-disabled="tx.readOnly || checkTxReadOnly"
                        ng-class="Validator.isPositiveNumber(tokenValue) ? 'is-valid' : 'is-invalid'"
                        ng-change="changedEth = Validator.isPositiveNumber(tokenValue) ? tokenValue / sellRate : 0"/>
                <div class="input-group-btn">
                  <span
                        class="btn btn-default btn-inside-input"
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
                <span class="strong underline" translate="LIBRE_sellAllApproved">
                  Sell All Available Tokens
                </span>
              </a>
            </p>
          
            <div class="col-sm-11 offset-col-sm-2">
              <button
                class="btn btn-std"
                ng-class="sellPending || !orderAllowed || !Validator.isPositiveNumber(tokenValue) || changedEth > ethBalance ?
                  'btn-default' : 'btn-success'"
                ng-click="sellModal()"
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
      <div class="col-sm-11" translate="LIBRE_rateProcessing">
        Rate information processing from the oracles...
      </div>
      <div class="col-sm-11">
        {{ readyOracles }} / {{ oracleCount }} <span translate="LIBRE_oraclesReceived">oracles have received data</span>
      </div>
      <div class="col-sm-11">
        <span translate="LIBRE_timeout">Timeout</span>: {{ waitOraclesRemains | secondsToDateTime | date:'HH:mm:ss' }} <span translate="LIBRE_remains">remains</span>
      </div>
      <div class="col-sm-11">&nbsp;</div>
      <div class="col-sm-11">
        <span translate="LIBRE_calculatingPossible">Calculating rates is possible when:</span>
        <ul>
          <li><span translate="LIBRE_calculatingPossible1">every oracle gets actual data</span></li>
          <li><span translate="LIBRE_calculatingPossible2">or timeout and at least</span> {{ MIN_READY_ORACLES }} <span translate="LIBRE_calculatingPossible3">oracles get actual data</span></li>
        </ul>
      </div>
    </section>
  
    <section ng-show="state == states.REQUEST_RATES">
      <div class="col-sm-8" ng-show="updateRatesAllowed">
        <div><span translate="LIBRE_callbackCost">Oracles callback gas price</span>: {{ callbackGas.value }} GWei</div>
        <input type="range" ng-model="callbackGas.value" min="{{callbackGas.min}}" max="{{callbackGas.max}}" step="1" 
          ng-change="recountRatesCost()"/>
      </div>      
      <div class="col-sm-11" ng-show="updateRatesAllowed">
        <span translate="LIBRE_RURCost">Est./max update rates cost</span>: {{ callbackGas.recalculated }} / {{ callbackGas.recalculatedMax }} ETH
      </div>

      <div class="col-sm-8">
        <button class="btn btn-block"
              ng-click="updateRatesModal()"
              ng-class="updateRatesAllowed ? 'btn-success' : 'btn-default'"
              ng-disabled="(updateRatesPending || calcRatesPending) || !updateRatesAllowed">
          {{ updateRatesPending ? 'LIBRE_txPending' : 'LIBREFORCE_RUR' | translate }}
        </button>
      </div>
    </section>

    <section ng-show="state == states.CALC_RATES">
      <div class="col-sm-11">
        <label translate="LIBRE_oraclesActual">
          Oracles have actual data. You need to initiate calculating buy and sell rates
        </label>
      </div>
      <div class="col-sm-11">
        <label>
            <p>{{ readyOracles }} / {{ oracleCount }} <span translate="LIBRE_oraclesActual1">oracles have actual data now. Each oracle's data is actual for 10 minutes.</span></p>
            <p><span translate="LIBRE_oraclesActual2">You need at least</span> {{ MIN_READY_ORACLES }} <span translate="LIBRE_oraclesActual3">actual oracles to calculate rates</span></p>
            <p><span translate="LIBRE_calcRateRemains">Time remaining for rates calculating:</span> {{ calcRatesRemains | secondsToDateTime | date:'HH:mm:ss' }}</p>
        </label>
      </div>
      <div class="col-sm-11">
        <button class="btn btn-block"
              ng-click="calcRatesModal()"
              ng-class="calcRatesAllowed ? 'btn-success' : 'btn-default'"
              ng-disabled="(updateRatesPending || calcRatesPending) || !calcRatesAllowed">
          {{ calcRatesPending ? 'LIBRE_txPending' : 'LIBREFORCE_CR' | translate }}
        </button>
      </div>
    </section>
  </article>

</div>
<!-- / Content -->

<!-- Sidebar -->
<section class="col-sm-4 no-padding">

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
