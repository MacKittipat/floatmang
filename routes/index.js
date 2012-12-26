
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', {
                data: {
                    message: 'hello from node'
                }
               });
}

