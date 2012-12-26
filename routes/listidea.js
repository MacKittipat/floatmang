/*
 * GET home page.
 */

exports.list = function(req, res){
    res.render('listidea', {
               data: {
               message: 'hello from node'
               }
               });
}
