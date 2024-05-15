

function parseQuery(query) {
  try{


    query = query.trim();
   
    const limitRegex = /\sLIMIT\s(\d+)/i;
        const limitMatch = query.match(limitRegex);
   
   
   
        let limit = null;
        if (limitMatch) {
            limit = parseInt(limitMatch[1], 10);
            query = query.replace(limitRegex, ''); // Remove LIMIT clause
        }

   // Process ORDER BY clause and remove it for further processing
   const orderByRegex = /\sORDER BY\s(.+)/i;
   const orderByMatch = query.match(orderByRegex);
   let orderByFields = null;
   if (orderByMatch) {
       orderByFields = orderByMatch[1].split(',').map(field => {
           const [fieldName, order] = field.trim().split(/\s+/);
           return { fieldName, order: order ? order.toUpperCase() : 'ASC' };
       });
       query = query.replace(orderByRegex, '');
   }



 // Process GROUP BY clause and remove it for further processing
 const groupByRegex = /\sGROUP BY\s(.+)/i;
 const groupByMatch = query.match(groupByRegex);
 let groupByFields = null;
 if (groupByMatch) {
     groupByFields = groupByMatch[1].split(',').map(field => field.trim());
     query = query.replace(groupByRegex, '');
 }

 // Process WHERE clause
 const whereSplit = query.split(/\sWHERE\s/i);
 const queryWithoutWhere = whereSplit[0]; // Everything before WHERE clause
 const whereClause = whereSplit.length > 1 ? whereSplit[1].trim() : null;

    
    

    

   

 // Process JOIN clause
 const joinSplit = queryWithoutWhere.split(/\s(INNER|LEFT|RIGHT) JOIN\s/i);
 const selectPart = joinSplit[0].trim(); // Everything before JOIN clause


   // Extract JOIN information
   const { joinType, joinTable, joinCondition } = parseJoinClause(queryWithoutWhere);

   
   


   // Parse SELECT part
   const selectRegex = /^SELECT\s(.+?)\sFROM\s(.+)/i;
   const selectMatch = selectPart.match(selectRegex);
   if (!selectMatch) {
       throw new Error('Invalid SELECT format');
   }
   const [, fields, table] = selectMatch;
    
   let whereClauses = [];
   if (whereClause) {
       whereClauses = parseWhereClause(whereClause);
   }
    

    // Check for aggregate functions without GROUP BY
    const hasAggregateWithoutGroupBy = checkAggregateWithoutGroupBy(query, groupByFields);

    return {
        fields: fields.split(',').map(field => field.trim()),
        table: table.trim(),
        whereClauses,
        joinType,
        joinTable,
        joinCondition,
        groupByFields,
        orderByFields,
        hasAggregateWithoutGroupBy,
        limit
    };
} catch (error) {
    console.log(error.message);
    throw new Error(`Query parsing error: ${error.message}`);
    }
}
function checkAggregateWithoutGroupBy(query, groupByFields) {
    const aggregateFunctionRegex = /(\bCOUNT\b|\bAVG\b|\bSUM\b|\bMIN\b|\bMAX\b)\s*\(\s*(\*|\w+)\s*\)/i;
    return aggregateFunctionRegex.test(query) && !groupByFields;
}


function parseJoinClause(query) {
    const joinRegex = /\s(INNER|LEFT|RIGHT) JOIN\s(.+?)\sON\s([\w.]+)\s*=\s*([\w.]+)/i;
    const joinMatch = query.match(joinRegex);

    if (joinMatch) {
        return {
            joinType: joinMatch[1].trim(),
            joinTable: joinMatch[2].trim(),
            joinCondition: {
                left: joinMatch[3].trim(),
                right: joinMatch[4].trim()
            }
        };
    }

    return {
        joinType: null,
        joinTable: null,
        joinCondition: null
    };
}

function parseWhereClause(whereString) {
    if (!whereString) return []; // Handle case where there's no WHERE clause

    const conditionRegex = /(.*?)(=|!=|>|<|>=|<=)(.*)/;
    return whereString.split(/ AND | OR /i).map(conditionString => {
        const parts = conditionString.trim().split(/\s+/);
        const match = conditionString.trim().match(conditionRegex);
        if (match) {
            const [, field, operator, value] = match;
            
            if(parts.length !==3){
                throw new Error('Invalid condition format.'); 
            }

            if (!field || !operator || !value) {
                throw new Error('Invalid condition format.');
            }
            return { field: field.trim(), operator, value: value.trim() };
        }
        throw new Error('Invalid condition format');
    });
}




module.exports = { parseQuery, parseJoinClause };