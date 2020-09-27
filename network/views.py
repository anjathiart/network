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
def posts(request):
	# print(context)
	if request.method == "POST":
		print('trying to post')

	else:
		if request.GET.get('user_id') is not None:
			posts = Post.objects.filter(user__id = request.GET.get('user_id')).all()
		else:
			posts = Post.objects.all()

		return JsonResponse([post.serialize() for post in posts], safe=False)


def posts_followers(request):
	pass

def profile(request, user_id):
	# Query for user
	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return JsonResponse({"error": "User not found."}, status=404)

	return JsonResponse(user.serialize(), safe=False)


def update(request, post_id):

	# Query for post
	try:
		post = Post.objects.get(id=post_id)
	except Post.DoesNotExist:
		return JsonResponse({"error": "Post not found."}, status=404)


	# Check recipient emails
	data = json.loads(request.body)

	if data.get('liked') is not None:
		if data['liked'] == False:
			post.likes.remove(request.user)
		else:
			post.likes.add(request.user)
			
	post.save()
	return HttpResponse(status=204)


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




