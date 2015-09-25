if (Meteor.isServer) {
  // add the multipart middleware to meteor's connect stack
  WebApp.connectHandlers.use(multipart());

  // this could be a route if you're using a router, but to keep things
  // simple i'm plugging directly into Meteor's connect handler stack.
  WebApp.connectHandlers.use(function handleFileUpload (request, response, next) {
    // is it a file upload request with myFile?
    // of course we could use routing here.
    if (request.params && request.params.myFile) {
      let file = request.params.myFile;

      // just pipe the file to standard output (the console)
      file.pipe(process.stdout);

      // when the file is done being piped to stdout, send
      // back a 302 (redirect) status code to the browser and
      // end the response! the multipart middleware will take
      // care of the tmp file cleanup.
      file.on('end', () => {
        response.writeHead(302, {'Location': '/'})
        response.end();
      });
    } else {
      next();
    }
  });
}
