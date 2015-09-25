var os = Npm.require('os');
var fs = Npm.require('fs');
var path = Npm.require('path');
var Busboy = Npm.require('busboy');

function tmpPath () {
  var id = null;
  var tmp = os.tmpDir();

  do {
    id = (Date.now() + Math.random()).toString();
  } while(fs.existsSync(path.join(tmp, id)))

  return path.join(tmp, id);
}

multipart = function (opts = {}) {
  return function middlewareMiddleware (request, response, next) {
    if (request.method == 'POST' || request.method == 'PUT' || request.method == 'PATCH') {
      var busboy = new Busboy(request);
      var cleanupPaths = []
      request.params = request.params || {};

      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        // create a temporary filepath
        var filepath = tmpPath();

        // add the filepath to the cleanup paths so we can delete the temp file
        // when the response finishes.
        cleanupPaths.push(filepath);

        // pipe the file contents to a write stream which will
        // write the file X bytes at a time to the given filepath
        file.pipe(fs.createWriteStream(filepath));

        // now create a readStream object that we can attach to
        // the request as a parameter that can be used by downstream
        // middleware.
        var io = fs.createReadStream(filepath);

        // attach the additional properties to the io stream in case the user needs
        // them.
        io.originalFilename = filename;
        io.encoding = encoding;
        io.mimetype = mimetype;

        // attach to the parameters object of the request. So let's say you had a
        // file field named myFile. You can pipe the contents of the file like
        // this:
        //
        //   function (request, response, next) {
        //    var myFile = request.params.myFile;
        //    console.log(`downloading file: ${myFile.originalFilename}`);
        //    request.params.myFile.pipe(process.stdout);
        //   }
        request.params[fieldname] = io;
      });

      // handle regular fields too
      busboy.on('field', (fieldname, value) => { request.params[fieldname] = value; });

      // when busboy is done parsing the http request, pass control to the next
      // middleware handler. since this is called asynchronously, and it's
      // possible downstream middleware will call into meteor methods that require
      // a Fiber, we need to bind the environment here. We can pass the 'next'
      // function value directly though.
      busboy.on('finish', Meteor.bindEnvironment(next));

      // when the response is completely done, destroy the temporary files so they
      // don't pile up.
      response.on('finish', () => {
        cleanupPaths.forEach((filepath) => {
          fs.unlink(filepath, (err) => console.error(err));
        });
      });

      // ok kickoff time. pipe the request into busboy to start the process.
      request.pipe(busboy);
    } else {
      next();
    }
  }
};
