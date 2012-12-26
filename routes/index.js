exports.login = function(req, res){
    res.render('login', {
        data: {
            message: 'hello from node'
        }
    });
}

exports.topic = function(req, res){
    res.render('topic', {
        data: {
            message: 'hello from node'
        }
    });
}
