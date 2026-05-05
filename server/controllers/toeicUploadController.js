function uploadFiles(req, res) {
  const savedFiles = {
    images: req.files?.images?.map((file) => file.filename) || [],
    audios: req.files?.audios?.map((file) => file.filename) || [],
  };

  res.json({
    message: 'TOEIC files uploaded successfully.',
    files: savedFiles,
  });
}

module.exports = {
  uploadFiles,
};
