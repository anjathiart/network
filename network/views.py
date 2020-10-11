import json

from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post

def index(request):
	return render(request, "network/index.html")

# Returns information for the current logged in user
def current_user(request):
	if request.user.is_authenticated:
		follows = User.objects.filter(followers__id=request.user.id).count()
		result = request.user.serialize()
		result['followsCount'] = follows
		return JsonResponse(result, safe=False)
	else:
		return JsonResponse({"error": "Unauthorised"}, status=401)

# return all posts based on the query parameters
def posts(request):
	if request.method == "GET":
		page = request.GET.get('page', 1)
		if request.GET.get('user_id') is not None:
			posts = Post.objects.filter(user__id = request.GET.get('user_id')).all()
		elif request.GET.get('following') is not None:
			users_followed = User.objects.filter(followers__id=request.user.id).all()
			posts = Post.objects.filter(user__in=users_followed).all()
		else:
			posts = Post.objects.all()

		paginator = Paginator(posts, 10)
		post_objects = paginator.get_page(page)
		posts_serialized = [post.serialize() for post in post_objects]
		data = {
			"prev": post_objects.has_previous(),
			"next": post_objects.has_next(),
			"num_pages": paginator.num_pages,
			"page": page,
			"posts": posts_serialized
		}
		return JsonResponse(data, safe=False)

	elif request.method == "POST":
		if not request.user.is_authenticated:
			return JsonResponse({"error": "user is not logged in"}, status=401)
		
		data = json.loads(request.body)
		# validate post body
		if data.get('body') is None:
			return JsonResponse({"error": "Missing request body"}, status=400)
		elif len(data['body']) == 0:
			return JsonResponse({"error": "Post cannot be empty"}, status=400)
		
		post = Post(body=data["body"], user=request.user)
		post.save()
		return HttpResponse(status=200)
	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)

# view to get a users profile information or to follow / unfollow a user
def user(request, user_id):
	if not request.user.is_authenticated:
		return JsonResponse({"error": "user is not logged in"}, status=401)
	
	if request.method == "GET" or request.method == "PUT":
		# Query for user
		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return JsonResponse({"error": "User not found."}, status=404)

		if request.method == "PUT":
			if request.user.id != user_id:
				data = json.loads(request.body)
				if data.get("follow") is not None:
					current_user = User.objects.get(id=request.user.id)
					if data["follow"] == False:
						user.followers.remove(current_user)
					if data["follow"] == True:
						user.followers.add(current_user)
					user.save();
				else:
					return JsonResponse({"error": "Missing 'follow' body field"}, status=400)
			else:
				return JsonResponse({"error": "A user cannot follow him/herself"}, status=403)
		result = user.serialize()		
		result['followsCount'] = User.objects.filter(followers__id=user_id).count()
		return JsonResponse(result, safe=False)
	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)


def like(request, post_id):
	if not request.user.is_authenticated:
		return JsonResponse({"error": "user is not logged in"}, status=401)

	if request.method == "PUT":
		# Query for post
		try:
			post = Post.objects.get(id=post_id)
		except Post.DoesNotExist:
			return JsonResponse({"error": "Post not found."}, status=404)

		post.likes.add(request.user)
		post.save()
		return HttpResponse(status=204)
	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)

def unlike(request, post_id):
	if not request.user.is_authenticated:
		return JsonResponse({"error": "user is not logged in"}, status=401)

	if request.method == "PUT":
		try:
			post = Post.objects.get(id=post_id)
		except Post.DoesNotExist:
			return JsonResponse({"error": "Post not found."}, status=404)

		post.likes.remove(request.user)
		post.save()
		return HttpResponse(status=204)
	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)

def edit(request, post_id):
	if not request.user.is_authenticated:
		return JsonResponse({"error": "user is not logged in"}, status=401)

	if request.method == "PUT":
		try:
			post = Post.objects.get(id=post_id)
		except Post.DoesNotExist:
			return JsonResponse({"error": "Post not found."}, status=404)

		if post.user == request.user:
			data = json.loads(request.body)
			if data.get('body') is None:
				return JsonResponse({"error": "Body missing"}, status=400)
			elif len(data['body']) == 0:
				return JsonResponse({"error": "Post cannot be empty"}, status=400)
			else:
				Post.objects.filter(id=post_id).update(body = data['body'])
				return HttpResponse(status=204)
		else:
			return JsonResponse({"error": "Scope does not allow this action"}, status=403)

	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)


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




