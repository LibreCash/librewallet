<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>

    <p>address: {{ address }}</p>
    <div>
        <ol>
            <li ng-repeat="(name, data) in contractData">{{name}} from {{data}}</li>
        </ol>
        <table>
            <tr ng-repeat="(name, data) in contractData">
                <td>{{ data.name }}</td>
                <td ng-if="!data.data.error">{{ data.data.data }}</td>
                <td ng-if="data.data.error">{{ data.data.message }}</td>
            </tr>
        </table>
    </div>
</main>
<!-- / Bank Status Page -->
