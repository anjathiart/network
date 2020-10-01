from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	followers = models.ManyToManyField("User", related_name="users_following")
	def serialize(self):
		return {
			"id": self.id,
			"name": self.username.capitalize(),
			"followers": [user.id for user in self.followers.all()],
		}



class Post(models.Model):
	user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
	body = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	modified_at = models.DateTimeField(auto_now=True)
	likes = models.ManyToManyField('User', blank=True, related_name="liked_posts" )

	def serialize(self):
		return {
			"id": self.id,
			"name": self.user.username.capitalize(),
			"userId": self.user.id,
			"body": self.body,
			"created": self.created_at.strftime("%b %-d %Y, %-I:%M %p"),
			"modified": self.modified_at.strftime("%b %-d %Y, %-I:%M %p"),
			"likes": [user.id for user in self.likes.all()],
		}
	
	class Meta:
		ordering= ["-created_at"]
