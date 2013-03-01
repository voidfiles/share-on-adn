# Share on ADN

This is mostly a repo I used for playing around with CORS which is something that the App.net API supports.

If you want to use this you will probably need to modify the fabfile to point to your s3 repo, you will also need to install s3cmd.

## Things you might want to do

If you want to deploy the bookmarklet

fab deploy

if you want to deploy the github pages

fab deploy_pages


For development

python app.py

Modify files till your ready.

You should already have a bookrmarklet that points locally, but if not here is one:

javascript:void((function()%7BSADN_ROOT%3D%27http://127.0.0.1:5000%27%3Bvar%20e%3Ddocument.createElement(%27script%27)%3Be.setAttribute(%27type%27,%27text/javascript%27)%3Be.setAttribute(%27charset%27,%27UTF-8%27)%3Be.setAttribute(%27src%27,SADN_ROOT%20%2B%20%27/static/js/bookmarklet.js%3Fr%3D%27%2BMath.random()*99999999)%3Bdocument.body.appendChild(e)%7D)())%3B