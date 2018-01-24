<table class="table" ng-show="anyOrders">
    <tr>
        <td translate="LIBRE_orderID">ID</td>
        <td translate="LIBRE_orderType">Type</td>
        <td translate="LIBRE_orderRecipient">Recipient</td>
        <td translate="LIBRE_orderAmount">Amount</td>
        <td translate="LIBRE_orderTimestamp">Timestamp</td>
        <td translate="LIBRE_orderLimit">Rate Limit</td>
    </tr>
    <tr ng-repeat="(id, info) in orders">
        <td>{{ info.id }}</td>
        <td>{{ info.type }}</td>
        <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', info.recipient) }}" target="_blank"
            rel="noopener noreferrer">{{ info.recipient | limitTo: 15 }}&hellip;</a></td>
        <td>{{ info.amount }} {{ info.currency }}</td>
        <td>{{ info.timestamp }}</td>
        <td>{{ info.rateLimit }}</td>
    </tr>
</table>
<div class="col-sm-11" ng-hide="anyOrders" translate="LIBRE_orderNoOrders">
    You have no orders
</div>