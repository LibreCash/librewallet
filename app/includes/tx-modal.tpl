<article class="modal fade" id="txModal" tabindex="-1">
  <section class="modal-dialog">
    <section class="modal-content">

      <div class="modal-body">

        <button type="button" class="close" data-dismiss="modal" aria-label="Close Dialog">&times;</button>

        <h2 class="modal-title text-center">
          {{ txModal.title }}
        </h2>

        <table class="table small table-condensed table-hover">
          <tbody>
            <tr>
              <td class="small text-right" translate="LIBRE_modalETHToSend">ETH to send:</td>
              <td class="small text-left mono">{{ tx.value }} ETH</td>
            </tr>
            <tr>
              <td class="small text-right" translate="LIBRE_modalAccountBalance">Account Balance:</td>
              <td class="small text-left mono">{{ wallet.balance }}</td>
            </tr>
            <tr>
              <td class="small text-right" translate="LIBRE_modalGasPrice">Gas Price:</td>
              <td class="small text-left mono">{{ gasPrice.gwei }} GWEI</td>
            </tr>
            <tr>
              <td class="small text-right" translate="LIBRE_modalEstimatedGas">Estimated Gas:</td>
              <td class="small text-left mono">{{ txModal.estimatedGas }}</td>
            </tr>
            <tr>
              <td class="small text-right" translate="LIBRE_modalMaximumGas">Maximum Gas:</td>
              <td class="small text-left mono">{{ tx.gasLimit }}</td>
            </tr>
            <tr>
              <td class="small text-right" translate="LIBRE_modalEstimatedTXFee">Estimated TX Fee:</td>
              <td class="small text-left mono">{{ txModal.estimatedFee }} ETH</td>
            </tr>  
            <tr>
              <td class="small text-right" translate="LIBRE_modalMaximumTXFee">Maximum TX Fee:</td>
              <td class="small text-left mono">{{ txModal.maximumFee }} ETH</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <p translate="SENDModal_Content_3">
          Are you sure you want to do this?
        </p>
        <br />
        <button class="btn btn-default" data-dismiss="modal" translate="SENDModal_No">
          No, cancel
        </button>
        <button class="btn btn-primary" ng-click="txModal.modalClick()" translate="SENDModal_Yes">
          Yes, confirm
        </button>
      </div>

      <p class="small text-center" style="padding: 0px 5px;">
        <a href="https://myetherwallet.github.io/knowledge-base/transactions/transactions-not-showing-or-pending.html" target="_blank" ref="noopener noreferrer">
          The network is a bit overloaded. If you're having issues with TXs, please read me.
        </a>
      </p>



    </section>
  </section>
</article>
