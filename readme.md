table-Q 
======= 
 
 
# TableQ 
 
Create table service, takes the same arguments as the native azure library
 
@return {object}  Table Service    
 
# tableService.createTable 
 
Create table if not exists
 
@param {string} name The name of the table to create    
@return {&gt;bool}  success    
 
# tableService.getTables() 
 
Get a list of all table names
 
@return {&gt;array}  array of ALL table names    
 
# tableService.deleteTable 
 
Delete a table
 
@param {string} name The name of the table to delete    
@return {&gt;bool}  success    
 
# tableService.getTable() 
 
Get the service to access and individual table 
@param {string} tableName The table you want to access    
@return {object}  Table service for that table    
