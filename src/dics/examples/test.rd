// Use this language to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

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

table yves {
	id integer tata test
	titre varchar
	date timestamp
	list_users varchar
}
# Table des utilisateurs
table test.ateliers as test {
	id integer tata test
	titre varchar
	date timestamp
	# liste des utilisateurs de l'atelier
	list_users varchar
}

ref : ateliers.list_users > users.id
ref : ateliers.id <> users.id
ref : yves.id <> users.'test id'

enum job_status {
created : status at the beginning of the process[note: 'Waiting to be processed']
running : statut when activate[note: '']
done : status after completion[note: '']
'failure error' : status when error occurs[note: '']
}