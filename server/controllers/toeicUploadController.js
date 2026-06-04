function uploadFiles(req, res) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const savedFiles = {
    images: req.files?.images?.map((file) => ({
      filename: file.filename,
      url: `${baseUrl}/uploads/toeic/${file.filename}`,
    })) || [],
    audios: req.files?.audios?.map((file) => ({
      filename: file.filename,
      url: `${baseUrl}/uploads/toeic/${file.filename}`,
    })) || [],
  };

  res.json({
    message: 'TOEIC files uploaded successfully.',
    files: savedFiles,
  });
}

module.exports = {
  uploadFiles,
};
