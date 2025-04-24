<div className="relative">
  {document.filetype === 'pdf' ? (
    <iframe 
      src={`/api/documents/preview?filename=${encodeURIComponent(document.filename)}`}
      className="w-full h-48 rounded-lg"
    />
  ) : (
    <img
      src={`/api/documents/preview?filename=${encodeURIComponent(document.filename)}`}
      alt={document.filename}
      className="w-full h-48 object-cover rounded-lg"
    />
  )}
  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white">
    <span className="text-sm truncate">{document.filename}</span>
  </div>
</div> 