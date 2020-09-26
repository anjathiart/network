# TODO: add to requirements file any packages that are external
import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post


def index(request):
	return render(request, "network/index.html")

def userId(request):
	return JsonResponse({ "id": request.user.id }, safe=False)

def post(request):
	pass

# return all posts
def posts(request, context):
	if request.method == "POST":
		print('trying to post')
	elif context == "all":
		# Return posts in reverse chronologial order
		posts = Post.objects.all()

	elif context == "followed":
		followed_users = User.objects.filter(followers = request.user).all()
		posts = Post.objects.filter(user__in = followed_users).all()

	return JsonResponse([post.serialize() for post in posts], safe=False)


def posts_followers(request):
	pass

def profile(request, user_id):
	pass

def update(request, post_id):

	# Query for post
	try:
		post = Post.objects.get(id=post_id)
	except Post.DoesNotExist:
		return JsonResponse({"error": "Post not found."}, status=404)


	# Check recipient emails
	data = json.loads(request.body)
	print(data)

	# valid body parameters: liked | content
	# Update whether email is read or should be archived
	# if request.method == "PUT":
	# 	data = json.loads(request.body)
	# 	if data.get("liked") is not None:
	# 		post.read = data["read"]
	# 	if data.get("archived") is not None:
	# 		email.archived = data["archived"]
	# 	email.save()
	# 	return HttpResponse(status=204)

	if data['liked'] == True:
		print('like post')
	elif data['liked'] == False:
		print('unlike post')


	return JsonResponse({"error": "TODO"}, status=400)


def follow(request, user_id):
	pass




# API CALLS:
# GET posts, GET posts/userID, GET posts/following
# POST post
# Edit a post
# Like a post
# Follow a user
# GET user - get user details and get posts


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")




