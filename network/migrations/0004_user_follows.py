# Generated by Django 3.1 on 2020-09-27 19:14

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0003_auto_20200924_2031'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='follows',
            field=models.ManyToManyField(related_name='_user_follows_+', to=settings.AUTH_USER_MODEL),
        ),
    ]
