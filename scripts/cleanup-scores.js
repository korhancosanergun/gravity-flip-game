// Run with: mongosh gravitygame scripts/cleanup-scores.js
var users = db.scores.distinct('userId');
users.forEach(function(uid) {
  var best = db.scores.find({ userId: uid }).sort({ levelsCompleted: -1, totalFlips: 1 }).limit(1).toArray()[0];
  if (best) {
    var result = db.scores.deleteMany({ userId: uid, _id: { $ne: best._id } });
    print('User ' + uid + ': kept level=' + best.levelsCompleted + ' flips=' + best.totalFlips + ', deleted ' + result.deletedCount + ' old records');
  }
});
print('Total remaining: ' + db.scores.countDocuments());
