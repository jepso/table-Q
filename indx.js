var Q     = require('qq'),
    azure = require('azure');

/**
 * Create table service, takes the same arguments as the native azure library
 * 
 * @return {object} Table Service
 */
exports = function(){
    var service = azure.createTableService.apply(azure, arguments);
    var self = {};

    /**
     * Create table if not exists
     * 
     * @param {string} name The name of the table to create
     * @return {>bool} success
     */
    self.createTable = node(service.createTableIfNotExists, service);

    /**
     * Get a list of all table names
     * 
     * @return {>array} array of ALL table names
     */
    self.getTables = function(){
        var result = Q.defer();
        var res = [];

        service.queryTables(next)
        function next(err, tables, continuation){
            if(err) return result.reject(err);
            for(var i = 0; i<tables.length; i++){
                res.push(tables[i]);
            }
            if(continuation.hasNextPage()){
                continuation.getNextPage(next);
            }else{
                result.resolve(res);
            }
        };

        return result.promise;
    };

    /**
     * Delete a table
     * 
     * @param {string} name The name of the table to delete
     * @return {>bool} success
     */
    self.deleteTable = node(service.deleteTable, service);

    self.getTable = function(tableName){
        var table = {name:tableName};


        table.queryEntity = function (partitionKey, rowKey){
            return ncall(service.queryEntity, service, tableName, 
                partitionKey, rowKey);
        };

        table.deleteEntity = function (partitionKey, rowKey, Etag){
            return ncall(service.deleteEntity, service, 
                tableName, {PartitionKey:partitionKey,RowKey:rowKey,Etag:Etag},
                {checkEtag:(typeof Etag != "undefined")});
        }

        table.select = function(){
            var query = azure.TableQuery.select.apply(TableQuery, arguments)
                .from(tableName);
            query.execute = function(){

            };
        }

        return table;
    };

    return self;
};

function ncall(method, self){
    return node(method, self)
        .apply(self, Array.prototype.slice.call(arguments, 2));
}
function node(method, self){
    return function(){
        var args = Array.prototype.slice.call(arguments, 0);
        return Q.all(args).then(function(args){
            return Q.napply(method, self, args); 
        });
    }
}

function ObjectStream(){
    var ended = Q.defer();
    var listEnd = Q.resolve();
    var handlers = [];
    this.next = function(value){
        var nextValue = listEnd.then(function(){
            return value;
        }).then(function(){
            handlers.map(function(handler){
                return handler()
            });
        }, function(reason){
            end();
            return Q.reject(reason);
        })
        listEnd = nextValue;
    };
    var end = this.end = function(){
        listEnd.then(function(){
            ended.resolve();
        }, function(reason){
            ended.reject(reason);
        });
    };
    this.onNext = function(handler){

    };
    //return promise
    this.ended = function(){
        return ended.promise;
    };
}