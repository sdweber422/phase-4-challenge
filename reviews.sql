INSERT INTO reviews ( body ) VALUES ( 'This is my first review.' ) RETURNING *;
INSERT INTO user_album_reviews ( user_id, album_id, review_id ) VALUES ( 1, 1, (SELECT currval( 'reviews_id_seq' ) ));
INSERT INTO reviews ( body ) VALUES ( 'This is my second review.' ) RETURNING *;
INSERT INTO user_album_reviews ( user_id, album_id, review_id ) VALUES ( 1, 2, (SELECT currval( 'reviews_id_seq' ) ));
INSERT INTO reviews ( body ) VALUES ( 'This is my third review.' ) RETURNING *;
INSERT INTO user_album_reviews ( user_id, album_id, review_id ) VALUES ( 1, 3, (SELECT currval( 'reviews_id_seq' ) ));
