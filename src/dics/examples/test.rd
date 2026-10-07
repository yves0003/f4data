// Use this language to define your database structure

# Table des utilisateurs
table users as us {
	id integer [pk, "unique"]
	'test id' integer ["unique", pk]
	list_users varchar
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
	period: 'YYYY_MM'
	note: 'One dataset per month named user_admin_YYYY_MM'
}
# Table des utilisateufrs é de travaux pour les ateliers.
table test.ateliers as test {
	id integer
	titre varchar
	date timestamp
	# liste des utilisateurs de l'atelier
	list_users varchar
}

ref : ateliers.list_users > users.id
ref : ateliers.id - users.id
ref : user_admin.id <> users.'test id'

enum user_admin.job_status {
red : test
}

enum user_admin.list_users atelierds.id users.list_users {
created : status at the beginning of the process [note: "Waiting to be processed's"]
running : statut when activate
done : status after completion
'failure error' : status when error occurs
}

enum atelierds.titre {
'test' : status at the beginning of the process
running : statut when activate
done : status after completion
'failure error' : status when error occurs
}

enum libnames {
	test: '/sas_dir/test/alelier' [note: 'table des ateliers. last update: 2026-06']
}