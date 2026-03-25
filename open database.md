docker exec -it apexverse_postgres psql -U apexverse -d apexverse

Once inside the Postgres prompt, list tables with:

\dt

And check for users with:

SELECT * FROM users;