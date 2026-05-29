// Fix duplicate scores and create unique index
const users = db.scores.distinct('userId');
users.forEach(uid => {
  const docs = db.scores.find({ userId: uid }).sort({ levelsCompleted: -1, totalFlips: 1 }).toArray();
  if (docs.length > 1) {
    const keepId = docs[0]._id;
    const deleted = db.scores.deleteMany({ userId: uid, _id: { $ne: keepId } });
    print('Deleted ' + deleted.deletedCount + ' dupes for user ' + uid + ', kept lc=' + docs[0].levelsCompleted);
  } else {
    print('No dupes for user ' + uid + ' (lc=' + (docs[0] ? docs[0].levelsCompleted : 'none') + ')');
  }
});

// Drop existing composite index if any, create unique userId index
try { db.scores.dropIndex('levelsCompleted_-1_totalFlips_1'); } catch(e) {}
db.scores.createIndex({ userId: 1 }, { unique: true });
print('Unique index created on userId');

// Show remaining records
db.scores.find().toArray().forEach(s =>
  print('SCORE: user=' + s.username + ' lc=' + s.levelsCompleted + ' tf=' + s.totalFlips)
);
