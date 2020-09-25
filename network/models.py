from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	followers = models.ManyToManyField('self', related_name="users_follow")

class Post(models.Model):
	user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
	body = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	modified_at = models.DateTimeField(auto_now=True)
	likes = models.ManyToManyField('User', related_name="liked_posts" )
	# user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
	# sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="emails_sent")
	# recipients = models.ManyToManyField("User", related_name="emails_received")
	# subject = models.CharField(max_length=255)
	# body = models.TextField(blank=True)
	# timestamp = models.DateTimeField(auto_now_add=True)
	# read = models.BooleanField(default=False)
	# archived = models.BooleanField(default=False)
	def serialize(self):
		return {
			"id": self.id,
			"name": self.user.username,
			"body": self.body,
			"created": self.created_at.strftime("%b %-d %Y, %-I:%M %p"),
			"modified": self.modified_at.strftime("%b %-d %Y, %-I:%M %p"),
			"likes": [user.id for user in self.likes.all()],
		}
