
/*
 * GET home page.
 */

exports.login = function(req, res){
    res.render('login', {
                data: {
                    message: 'hello from node'
                }
               });
}

