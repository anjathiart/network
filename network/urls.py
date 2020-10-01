
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API
    path("user/current", views.userId, name="current_user"),
    path("user/<int:user_id>", views.profile, name="profile"),
    path("posts", views.posts, name="posts"),
    path("posts/<int:post_id>/like", views.like, name="like"),
    path("posts/<int:post_id>/unlike", views.unlike, name="unlike"),
    path("posts/<int:post_id>/edit", views.edit, name="edit"),
]
