// Use this language to define your database structure

# Table des utilisateurs
table users as us {
	id integer [pk, "unique"]
	'test id' integer [pk, "unique"]
	username varchar
	role varchar
	created_at timestamp
period: '2020 - 2022'
name string [ "not null", invalid_setting ]
	note: '''verification
verification
verification
verification'''
}

table yves_gaetabt_ {
	identifiant num
}
table user_admin {
	id integer tata test
	titre varchar
	date timestamp
	list_users varchar
	testament_user_dm varchar
	job_status varchar
}
# Table des utilisateufrs é de travaux.
table test.atelierds as test {
	id integer tata test
	titre varchar
	date timestamp
	# liste des utilisateurs de l'atelier
	list_users varchar
}

ref : ateliers.list_users > users.id
ref : ateliers.id <> users.id
ref : yves.id <> users.'test id'

enum user_admin.job_status {
red : test
}

enum user_admin.list_users atelierds.id {
created : status at the beginning of the process [note: 'Waiting to be processed']
running : statut when activate [note: '']
done : status after completion [note: '']
'failure error' : status when error occurs[note: '']
}

enum atelierds.titre {
'test' : status at the beginning of the process[note: 'Waiting to be processed']
running : statut when activate[note: '']
done : status after completion[note: '']
'failure error' : status when error occurs[note: '']
}