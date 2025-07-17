// Use this language to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

# Table des utilisateurs
table users as us {
	id integer [pk, "unique"]
	username varchar
	role varchar
	'test id' integer [pk, "unique"]
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
	#test de mesure
	List_Users varchar
}

ref : ateliers.list_users > users.id
ref : ateliers.id <> users.id
ref : yves.id <> users.'test id'

enum ateliers.List_Users {
0 : Origination [note: '']
1 : status at the beginning of the process [note: 'Waiting to be processed']
2 : statut when activate [note: '']
3 : status after completion [note: '']
'failure error' : status when error occurs [note: '']
-1 : test [note: '']
}

enum yves.titre {
éton : status at the beginning of the process [note: 'Waiting to be processed']
l'etak : revu  [note: '']
2 : statut when activate [note: '']
3 : status after completion [note: '']
'failure error' : status when error occurs [note: '']
}
