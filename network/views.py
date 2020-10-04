# TODO: add to requirements file any packages that are external
import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post

def index(request):
	return render(request, "network/index.html")

@login_required(login_url='/login')
def userId(request):
	follows = User.objects.filter(followers__id=request.user.id).count()
	result = request.user.serialize()
	result['followsCount'] = follows
	return JsonResponse(result, safe=False)

# return all posts
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

		paginator = Paginator(posts, 6)
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

	elif request.method == "POST" or request.method == "PUT":
		data = json.loads(request.body)
		if data.get('body') is None:
			return JsonResponse({"error": "Body missing"}, status=400)
		elif len(data['body']) == 0:
			return JsonResponse({"error": "Post cannot be empty"}, status=400)
	
		if request.method == "POST":
			post = Post(body=data["body"], user=request.user)
			post.save()
			return HttpResponse(status=200)

		if request.method == "PUT":
			try:
				post = Post.objects.get(id=post_id)
			except Post.DoesNotExist:
				return JsonResponse({"error": "Post not found."}, status=404)

			Post.objects.filter(id=post_id).update(body = data['body'])
			return HttpResponse(status=204)

	else:
		return JsonResponse({"error": "Method not allowed!"}, status=405)


@login_required(login_url='/login')
def profile(request, user_id):
	# Query for user
	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return JsonResponse({"error": "User not found."}, status=404)

	if request.method == "PUT":
		data = json.loads(request.body)
		if data.get("follow") is not None:
			current_user = User.objects.get(id=request.user.id)
			if data["follow"] == False:
				user.followers.remove(current_user)
			if data["follow"] == True:
				user.followers.add(current_user)
	user.save()
	result = user.serialize()		
	result['followsCount'] = User.objects.filter(followers__id=user_id).count()

	return JsonResponse(result, safe=False)

@login_required(login_url='/login')
def like(request, post_id):
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

@login_required(login_url='/login')
def unlike(request, post_id):
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

@login_required(login_url='/login')
def edit(request, post_id):
	if request.method == "PUT":
		try:
			post = Post.objects.get(id=post_id)
		except Post.DoesNotExist:
			return JsonResponse({"error": "Post not found."}, status=404)

		data = json.loads(request.body)
		if data.get('body') is None:
			return JsonResponse({"error": "Body missing"}, status=400)
		elif len(data['body']) == 0:
			return JsonResponse({"error": "Post cannot be empty"}, status=400)
		else:
			Post.objects.filter(id=post_id).update(body = data['body'])
			return HttpResponse(status=204)

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




